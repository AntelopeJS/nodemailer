import type { AllowedComponentProps, Component, VNodeProps } from "vue";
export type ExtractComponentProps<TComponent> = TComponent extends new () => {
    $props: infer P;
} ? Omit<P, keyof VNodeProps | keyof AllowedComponentProps> : never;
export declare const render: {
    <T extends Component>(component: T, props?: ExtractComponentProps<T>): Promise<string>;
    (vueFilePath: string, props?: Record<string, unknown>): Promise<string>;
};
