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

    protected getAvailabilityZoneNames(): string[] {
      return ['A', 'C', 'D'];
    }

    protected getSubnetMask(): string[] {
      return ['255.255.248.000', '255.255.224.000', '255.255.248.000'];
    }
}
