import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
  input: 'src/main.ts',
  output: {
    file: 'build/main.js',
    format: 'esm'
  },
  plugins: [
    replace({
      VERSION: JSON.stringify(pkg.version)
    }),
    typescript()
  ]
};
