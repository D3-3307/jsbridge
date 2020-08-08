import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'build/esm/main.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'build/umd/main.js',
      name: 'jsbridge',
      format: 'umd',
      sourcemap: true
    }
  ],
  plugins: [
    replace({
      VERSION: JSON.stringify(pkg.version)
    }),
    typescript()
  ]
};
