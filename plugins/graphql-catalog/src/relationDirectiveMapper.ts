/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { connectionFromArray } from 'graphql-relay';
import { Entity, parseEntityRef } from '@backstage/catalog-model';
import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLString,
  isInputType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isUnionType,
} from 'graphql';
import { ResolverContext } from './types';
import { DirectiveMapperAPI } from '@backstage/plugin-graphql-common';

function isConnectionType(type: unknown): type is GraphQLInterfaceType {
  return (
    (isInterfaceType(type) && type.name === 'Connection') ||
    (isNonNullType(type) && isConnectionType(type.ofType))
  );
}

function unboxNamedType(type: GraphQLOutputType): GraphQLNamedType {
  if (isNonNullType(type)) {
    return unboxNamedType(type.ofType);
  }
  if (isListType(type)) {
    return unboxNamedType(type.ofType);
  }
  return type;
}

function filterEntityRefs(
  entity: Entity | undefined,
  relationType?: string,
  targetKind?: string,
): string[] {
  return (
    entity?.relations
      ?.filter(({ type }) => !relationType || type === relationType)
      .flatMap(({ targetRef }) => {
        const ref = parseEntityRef(targetRef);
        return !targetKind ||
          ref.kind.toLowerCase() === targetKind.toLowerCase()
          ? [targetRef]
          : [];
      }) ?? []
  );
}

function createConnectionType(
  nodeType: GraphQLInterfaceType | GraphQLObjectType,
  fieldType: GraphQLInterfaceType,
): GraphQLObjectType {
  const wrappedEdgeType = fieldType.getFields().edges.type as GraphQLNonNull<
    GraphQLList<GraphQLNonNull<GraphQLInterfaceType>>
  >;
  const edgeType = wrappedEdgeType.ofType.ofType.ofType as GraphQLInterfaceType;

  return new GraphQLObjectType({
    name: `${nodeType.name}Connection`,
    fields: {
      ...fieldType.toConfig().fields,
      edges: {
        type: new GraphQLNonNull(
          new GraphQLList(
            new GraphQLNonNull(
              new GraphQLObjectType({
                name: `${nodeType.name}Edge`,
                fields: {
                  ...edgeType.toConfig().fields,
                  node: {
                    type: new GraphQLNonNull(nodeType),
                  },
                },
                interfaces: [edgeType],
              }),
            ),
          ),
        ),
      },
    },
    interfaces: [fieldType],
  });
}

export function relationDirectiveMapper(
  field: GraphQLFieldConfig<{ id: string }, ResolverContext>,
  directive: Record<string, any>,
  api: DirectiveMapperAPI,
) {
  const fieldType = field.type;
  if (
    (isListType(fieldType) && isConnectionType(fieldType.ofType)) ||
    (isNonNullType(fieldType) &&
      isListType(fieldType.ofType) &&
      isConnectionType(fieldType.ofType.ofType))
  ) {
    throw new Error(
      `It's not possible to use a list of Connection type. Use either Connection type or list of specific type`,
    );
  }
  const isList =
    isListType(fieldType) ||
    (isNonNullType(fieldType) && isListType(fieldType.ofType));

  if (isConnectionType(fieldType)) {
    if (directive.nodeType) {
      const nodeType = api.typeMap[directive.nodeType];

      if (!nodeType) {
        throw new Error(
          `The interface "${directive.nodeType}" is not defined in the schema`,
        );
      }
      if (isInputType(nodeType)) {
        throw new Error(
          `The interface "${directive.nodeType}" is an input type and can't be used in a Connection`,
        );
      }
      if (isUnionType(nodeType)) {
        const resolveType = nodeType.resolveType;
        if (resolveType)
          throw new Error(
            `The "resolveType" function has already been implemented for "${nodeType.name}" union which may lead to undefined behavior`,
          );
        const iface = (api.typeMap[directive.nodeType] =
          new GraphQLInterfaceType({
            name: directive.nodeType,
            interfaces: [api.typeMap.Node as GraphQLInterfaceType],
            fields: { id: { type: new GraphQLNonNull(GraphQLID) } },
            resolveType: (...args) =>
              (api.typeMap.Node as GraphQLInterfaceType).resolveType?.(...args),
          }));
        const types = nodeType.getTypes().map(type => type.name);
        types.forEach(typeName => {
          const type = api.typeMap[typeName];
          if (isInterfaceType(type)) {
            api.typeMap[typeName] = new GraphQLInterfaceType({
              ...type.toConfig(),
              interfaces: [...type.getInterfaces(), iface],
            });
          }
          if (isObjectType(type)) {
            api.typeMap[typeName] = new GraphQLObjectType({
              ...type.toConfig(),
              interfaces: [...type.getInterfaces(), iface],
            });
          }
        });

        field.type = createConnectionType(iface, fieldType);
      } else {
        field.type = createConnectionType(nodeType, fieldType);
      }
    } else {
      field.type = createConnectionType(
        api.typeMap.Node as GraphQLInterfaceType,
        fieldType,
      );
    }
    const mandatoryArgs: [string, string][] = [
      ['first', 'Int'],
      ['after', 'String'],
      ['last', 'Int'],
      ['before', 'String'],
    ];

    const fieldArgs = { ...field.args };
    mandatoryArgs.forEach(([name, type]) => {
      if (name in fieldArgs) {
        const argType = fieldArgs[name].type;
        if (
          (isNonNullType(argType)
            ? argType.ofType.toString()
            : argType.name) !== type
        ) {
          throw new Error(
            `The field has mandatory argument "${name}" with different type than expected. Expected: ${type}`,
          );
        }
      }
      fieldArgs[name] = { type: type === 'Int' ? GraphQLInt : GraphQLString };
    });
    field.args = fieldArgs;

    field.resolve = async ({ id }, args, { loader, encodeId, decodeId }) => {
      const { source } = decodeId(id);
      const ids = filterEntityRefs(
        await loader.load(id),
        directive.name,
        directive.kind,
      ).map(ref => ({
        id: encodeId({ source, typename: directive.nodeType ?? 'Node', ref }),
      }));
      return {
        ...connectionFromArray(ids, args),
        count: ids.length,
      };
    };
  } else {
    field.resolve = async ({ id }, _, { loader, encodeId, decodeId }) => {
      const { source } = decodeId(id);
      const ids = filterEntityRefs(
        await loader.load(id),
        directive.name,
        directive.kind,
      ).map(ref => ({
        id: encodeId({
          source,
          typename: unboxNamedType(field.type).name,
          ref,
        }),
      }));
      return isList ? ids : ids[0] ?? null;
    };
  }
}
