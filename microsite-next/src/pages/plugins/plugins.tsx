import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';

import { IPluginData, PluginCard } from './plugin-card';
import pluginsStyles from './plugins.module.scss';

//#region Plugin data import
const maxDescLength = 160;

const truncatePluginDescription = (pluginData: IPluginData) =>
  pluginData.description.length > maxDescLength
    ? {
        ...pluginData,
        description: pluginData.description.slice(0, maxDescLength) + '...',
      }
    : pluginData;

const pluginsContext = require.context(
  '../../../../microsite/data/plugins',
  false,
  /\.ya?ml/,
);

const plugins = pluginsContext.keys().reduce(
  (acum, id) => {
    const pluginData: IPluginData = pluginsContext(id).default;

    acum[
      pluginData.category === 'Core Feature' ? 'corePlugins' : 'otherPlugins'
    ].push(truncatePluginDescription(pluginData));

    return acum;
  },
  { corePlugins: [] as IPluginData[], otherPlugins: [] as IPluginData[] },
);

plugins.corePlugins.sort((a, b) => a.order - b.order);
plugins.otherPlugins.sort((a, b) => a.order - b.order);
//#endregion

export function Plugins() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout>
      <div
        className={clsx('container', 'padding--lg', pluginsStyles.pluginsPage)}
      >
        <div className="marketplaceBanner">
          <div className="marketplaceContent">
            <h2>Plugin Marketplace</h2>

            <p>
              Open source plugins that you can add to your Backstage deployment.
              Learn how to build a <Link to="/docs/plugins">plugin</Link>.
            </p>
          </div>

          <Link
            to="/docs/plugins/add-to-marketplace"
            className="button button--outline button--primary"
          >
            Add to Marketplace
          </Link>
        </div>

        <div className="bulletLine margin-bottom--lg"></div>

        <h2>Core Features</h2>

        <div className="pluginsContainer margin-bottom--lg">
          {plugins.corePlugins.map(pluginData => (
            <PluginCard key={pluginData.title} {...pluginData}></PluginCard>
          ))}
        </div>

        <h2>All Plugins</h2>

        <div className="pluginsContainer margin-bottom--lg">
          {plugins.otherPlugins.map(pluginData => (
            <PluginCard key={pluginData.title} {...pluginData}></PluginCard>
          ))}
        </div>
      </div>
    </Layout>
  );
}
