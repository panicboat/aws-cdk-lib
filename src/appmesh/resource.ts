import * as cdk from '@aws-cdk/core';

interface Props {
  projectName: string;
}
export abstract class Resource {
    protected scope: cdk.Construct;
    protected stack: cdk.Stack;

    constructor(scope: cdk.Construct) {
      this.scope = scope;
      this.stack = cdk.Stack.of(this.scope);
    }

    public abstract createResources(props: Props): void;
}
