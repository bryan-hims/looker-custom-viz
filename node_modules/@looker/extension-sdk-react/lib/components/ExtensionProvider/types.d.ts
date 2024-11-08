import type { Looker40SDK } from '@looker/sdk';
import type { BaseExtensionContextData } from '../ExtensionConnector';
export interface ExtensionContextData extends BaseExtensionContextData {
    core40SDK: Looker40SDK;
}
