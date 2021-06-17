const React = require('react');
const { Redirect } = require('@docusaurus/router');

const siteConfig = require(process.cwd() + '/siteConfig.js');

import Layout from "@theme/Layout";

function Docs() {
  return (
    <Redirect to="/docs/overview/what-is-backstage" config={siteConfig} />
  );
}

export default props => <Layout><Docs {...props} /></Layout>;
