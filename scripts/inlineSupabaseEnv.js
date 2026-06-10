const fs = require('fs');
const path = require('path');

const ENV_KEYS = new Set([
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'REACT_NATIVE_SUPABASE_URL',
  'REACT_NATIVE_SUPABASE_ANON_KEY',
]);

function parseEnvValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function readDotEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);

      if (!match || line.trim().startsWith('#')) {
        return env;
      }

      const [, key, value] = match;
      env[key] = parseEnvValue(value);
      return env;
    }, {});
}

function readEnvValues() {
  const dotEnv = readDotEnv();

  return Array.from(ENV_KEYS).reduce((values, key) => {
    values[key] = process.env[key] ?? dotEnv[key] ?? '';
    return values;
  }, {});
}

function getEnvKeyFromMember(node) {
  if (!node.property || node.computed || !ENV_KEYS.has(node.property.name)) {
    return undefined;
  }

  const envNode = node.object;

  if (
    envNode?.type === 'MemberExpression' &&
    envNode.object?.type === 'Identifier' &&
    envNode.object.name === 'process' &&
    envNode.property?.type === 'Identifier' &&
    envNode.property.name === 'env'
  ) {
    return node.property.name;
  }

  return undefined;
}

module.exports = function inlineSupabaseEnv({types: t}) {
  const values = readEnvValues();

  return {
    name: 'inline-supabase-env',
    visitor: {
      MemberExpression(memberPath) {
        const key = getEnvKeyFromMember(memberPath.node);

        if (!key) {
          return;
        }

        memberPath.replaceWith(t.stringLiteral(values[key]));
      },
    },
  };
};
