import * as cdk from '@aws-cdk/core';
import { CfnInternetGateway, CfnVPCGatewayAttachment, CfnEIP, CfnNatGateway, CfnTransitGateway, CfnTransitGatewayAttachment } from '@aws-cdk/aws-ec2';
import { CfnResourceShare } from '@aws-cdk/aws-ram';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  subnets: {
    public: string[];
    private: string[];
  };
  principal: {
    primary: {
      transitGatewayId: string;
    };
    secondary: {
      accountIds: string[];
    };
  };
}
interface IGateway {
  readonly internetGatewayId: string;
  readonly natGatewayIds: string[];
  readonly transitGatewayId: string;
  readonly attachment: cdk.CfnResource;
  createResources(props: Props): void;
}
export class Gateway extends Resource implements IGateway {
  public internetGatewayId: string = '';
  public natGatewayIds: string[] = [];
  public transitGatewayId: string = '';
  public attachment!: cdk.CfnResource;
  public createResources(props: Props): void {
    this.createInternetGateway(this.scope, props);
    if (props.principal.primary.transitGatewayId.length === 0) {
      // For primary account
      this.createNatGateway(this.scope, props);
    }
    if (0 < props.principal.secondary.accountIds.length) {
      // For primary account
      this.createTransitGateway(this.scope, this.stack, props);
    }
    if (0 < props.principal.primary.transitGatewayId.length) {
      // For secondary accounts
      this.createTransitGatewayAttachment(this.scope, props, props.principal.primary.transitGatewayId);
    }
  }

  private createInternetGateway(scope: cdk.Construct, props: Props): void {
    const igw = new CfnInternetGateway(scope, 'InternetGateway', {
    });
    new CfnVPCGatewayAttachment(scope, 'VpcGatewayAttachment', {
      vpcId: props.vpcId,
      internetGatewayId: igw.ref,
    });
    this.internetGatewayId = igw.ref;
  }

  private createNatGateway(scope: cdk.Construct, props: Props): void {
    let azName: string[] = this.getAvailabilityZoneNames();
    for (let i = 0; i < azName.length; i++) {
      const eip = new CfnEIP(scope, `ElasticIp${azName[i]}`, {
        domain: 'vpc',
      });
      const natGateway = new CfnNatGateway(scope, `NatGateway${azName[i]}`, {
        allocationId: cdk.Fn.getAtt(eip.logicalId, 'AllocationId').toString(),
        subnetId: props.subnets.public[i],
      });
      this.natGatewayIds.push(natGateway.ref);
    }
  }

  private createTransitGateway(scope: cdk.Construct, stack: cdk.Stack, props: Props): void {
    const tgw = new CfnTransitGateway(scope, 'TransitGateway', {
      autoAcceptSharedAttachments: 'enable',
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
    });
    new CfnResourceShare(scope, 'ResourceShare', {
      name: 'Provisioning',
      principals: props.principal.secondary.accountIds,
      resourceArns: [
        `arn:aws:ec2:${stack.region}:${stack.account}:transit-gateway/${cdk.Fn.getAtt(tgw.logicalId, 'Id').toString()}`,
      ]
    });
    new cdk.CfnOutput(scope, `ExportTransitGateway`, {
      value: cdk.Fn.getAtt(tgw.logicalId, 'Id').toString(),
      exportName: `${props.projectName}:TransitGateway`,
    });
    this.transitGatewayId = cdk.Fn.getAtt(tgw.logicalId, 'Id').toString();
    this.createTransitGatewayAttachment(scope, props, this.transitGatewayId);
  }

  private createTransitGatewayAttachment(scope: cdk.Construct, props: Props, transitGatewayId: string): void {
    const attachment = new CfnTransitGatewayAttachment(scope, `TransitGatewayAttachment`, {
      transitGatewayId: transitGatewayId,
      vpcId: props.vpcId,
      subnetIds: props.subnets.private,
    });
    new cdk.CfnOutput(scope, `ExportTransitGatewayAttachment`, {
      value: attachment.ref,
      exportName: `${props.projectName}:TransitGatewayAttachment`,
    });
    this.attachment = attachment;
  }
}
