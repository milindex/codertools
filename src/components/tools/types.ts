import type { ComponentType } from 'react';

export type ToolComponent = ComponentType;

export type CategoryModule = {
  components: Record<string, ToolComponent>;
};
