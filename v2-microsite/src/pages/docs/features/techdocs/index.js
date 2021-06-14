const React = require('react');
const Redirect = require('../../../../../core/Redirect.js');

const siteConfig = require(process.cwd() + '/siteConfig.js');

import Layout from "@theme/Layout";

function Docs() {
  return (
    <Redirect
      redirect="/docs/features/techdocs/techdocs-overview"
      config={siteConfig}
    />
  );
}

export default props => <Layout><Docs {...props} /></Layout>;
