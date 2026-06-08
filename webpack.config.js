const path = require('path');
const { readdirSync } = require('fs');

const scenariosDir = path.resolve(__dirname, 'src/scenarios');
const scenarios = readdirSync(scenariosDir)
  .filter(f => f.endsWith('.ts'))
  .reduce((entries, file) => {
    const name = path.basename(file, '.ts');
    entries[name] = path.join(scenariosDir, file);
    return entries;
  }, {});

module.exports = {
  mode: 'production',
  entry: scenarios,
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@helpers': path.resolve(__dirname, 'src/helpers'),
      '@flows': path.resolve(__dirname, 'src/flows'),
    },
  },
  module: {
    rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }],
  },
  target: 'web',
  externals: /^(k6|https?:\/\/)(\/.*)?/,
  stats: { colors: true },
  performance: { hints: false },
  optimization: { minimize: false },
};
