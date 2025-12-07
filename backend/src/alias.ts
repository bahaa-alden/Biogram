import moduleAlias from 'module-alias';
import path from 'path';

moduleAlias.addAliases({
  '@models': path.join(__dirname, 'models'),
  '@middlewares': path.join(__dirname, 'middlewares'),
  '@helpers': path.join(__dirname, 'helpers'),
  '@config': path.join(__dirname, 'config'),
  '@modules': path.join(__dirname, 'modules'),
  '@controllers': path.join(__dirname, 'controllers'),
  '@utils': path.join(__dirname, 'utils'),
  '@routes': path.join(__dirname, 'routes'),
});
