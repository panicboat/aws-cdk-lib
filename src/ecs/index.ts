import * as cdk from '@aws-cdk/core';

interface Props {
  projectName: string;
}
interface IEcsResources {
}
export class EcsResources extends cdk.Construct implements IEcsResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);
  }
}
