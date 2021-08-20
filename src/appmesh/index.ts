import * as cdk from '@aws-cdk/core';

interface Props {
  projectName: string;
}
interface IMeshResources {
}
export class MeshResources extends cdk.Construct implements IMeshResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);
  }
}
