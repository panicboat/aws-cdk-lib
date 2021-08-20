import * as cdk from '@aws-cdk/core';
import { CfnVPCEndpoint } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  subnets: {
    protected: string[],
  },
  securityGroupIds: string[];
}
interface IEndpoint {
  createResources(props: Props): void;
}
export class Endpoint extends Resource implements IEndpoint {
  public createResources(props: Props): void {
    let endpoints: { serviceName: string; privateDnsEnabled: boolean }[] = [
      { serviceName: 'ssm', privateDnsEnabled: true },
      { serviceName: 'ssmmessages', privateDnsEnabled: true },
      { serviceName: 'ec2messages', privateDnsEnabled: true },
      { serviceName: 's3', privateDnsEnabled: false },
    ];
    for (let i = 0; i < endpoints.length; i++) {
      new CfnVPCEndpoint(this.scope, `VpcEndpoint-${endpoints[i].serviceName}`, {
        serviceName: `com.amazonaws.${this.stack.region}.${endpoints[i].serviceName}`,
        vpcId: props.vpcId,
        privateDnsEnabled: endpoints[i].privateDnsEnabled,
        securityGroupIds: props.securityGroupIds,
        subnetIds: props.subnets.protected,
        vpcEndpointType: 'Interface',
      });
    }
  }
}
