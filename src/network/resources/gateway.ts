import * as cdk from '@aws-cdk/core';
import { CfnInternetGateway, CfnVPCGatewayAttachment, CfnEIP, CfnNatGateway } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  subnets: {
    protected: string[]
  }
}
interface IGateway {
  readonly gatewayId: string;
  readonly natGatewayId: string[];
  createResources(props: Props): void;
}
export class Gateway extends Resource implements IGateway {
  public gatewayId!: string;
  public natGatewayId: string[] = [];

  public createResources(props: Props): void {
    const igw = new CfnInternetGateway(this.scope, 'InternetGateway', {
    });
    new CfnVPCGatewayAttachment(this.scope, 'VpcGatewayAttachment', {
      vpcId: props.vpcId,
      internetGatewayId: igw.ref,
    });
    let azName: string[] = this.getAvailabilityZoneNames();
    for (let i = 0; i < azName.length; i++) {
      const eip = new CfnEIP(this.scope, `Eip${azName[i]}`, {
        domain: 'vpc',
      });
      const natGateway = new CfnNatGateway(this.scope, `NatGateway${azName[i]}`, {
        allocationId: cdk.Fn.getAtt(eip.logicalId, 'AllocationId').toString(),
        subnetId: props.subnets.protected[i],
      });
      this.natGatewayId.push(natGateway.ref);
    }
    this.gatewayId = igw.ref;
  }
}
