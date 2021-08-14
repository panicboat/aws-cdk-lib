import * as cdk from '@aws-cdk/core';
import { CfnSecurityGroup, CfnSecurityGroupIngress, CfnVPCEndpoint } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  cidrBlock: string;
  subnets: {
    protected: string[],
  }
}
interface IEndpoint {
  createResources(props: Props): void;
}
export class Endpoint extends Resource implements IEndpoint {

  public createResources(props: Props): void {
    const sg = new CfnSecurityGroup(this.scope, 'SGforVPCEndpoint', {
      groupDescription: 'security group for vpc endpoints.',
      groupName: 'SGforVPCEndpoint',
      vpcId: props.vpcId,
    });
    new CfnSecurityGroupIngress(this.scope, 'SGIngressforVPCEndpoint', {
      ipProtocol: '-1',
      groupId: sg.ref,
      cidrIp: props.cidrBlock,
    });
    let endpoints = [
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
        securityGroupIds: [ sg.ref ],
        subnetIds: props.subnets.protected,
        vpcEndpointType: 'Interface',
      });
    }
  }
}
