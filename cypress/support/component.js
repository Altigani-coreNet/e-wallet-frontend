import './commands';
import { mount } from 'cypress/react';
import '../../src/i18n/config';

Cypress.Commands.add('mount', mount);
