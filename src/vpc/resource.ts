import { SubnetType } from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

export abstract class Resource {
  protected scope: cdk.Construct;
  protected stack: cdk.Stack;

  constructor(scope: cdk.Construct) {
    this.scope = scope;
    this.stack = cdk.Stack.of(this.scope);
  }

  protected getAvailabilityZoneNames(): string[] {
    return ['A', 'C', 'D'];
  }

  protected getSubnet(): { label: string, mask: string }[] {
    return [
      { label: SubnetType.PRIVATE_WITH_NAT, mask: '255.255.224.000' },
      { label: SubnetType.PUBLIC,           mask: '255.255.240.000' },
      { label: SubnetType.PRIVATE_ISOLATED, mask: '255.255.240.000' },
    ]
  }
}
