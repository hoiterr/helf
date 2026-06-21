import type { Preview } from '@storybook/react';
import '../src/tokens/tokens.css';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'helf',
      values: [
        { name: 'helf', value: '#f6f7f9' },
        { name: 'dark', value: '#0c0d10' },
      ],
    },
  },
};

export default preview;
