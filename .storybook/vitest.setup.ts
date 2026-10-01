import { setProjectAnnotations } from '@storybook/react-vite';
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import * as projectAnnotations from './preview';

/* The story tests render with the same annotations the Storybook does,
   including the a11y addon's, so an axe violation that shows in the
   Storybook fails in the terminal and in CI too. */
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
