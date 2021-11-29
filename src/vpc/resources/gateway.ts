import * as cdk from '@aws-cdk/core';
import { CfnInternetGateway, CfnVPCGatewayAttachment, CfnEIP, CfnNatGateway, CfnTransitGateway, CfnTransitGatewayAttachment } from '@aws-cdk/aws-ec2';
import { CfnResourceShare } from '@aws-cdk/aws-ram';
import { Resource } from '../resource';
import { AttachTransitGatewayProps, InternetGatewayProps, NatGatewayProps, TransitGatewayProps } from '../props';

interface IGateway {
  createInternetGateway(props: InternetGatewayProps): string;
  createNatGateway(props: NatGatewayProps): string[];
  createTransitGateway(props: TransitGatewayProps): string;
  attachTransitGateway(props: AttachTransitGatewayProps): CfnTransitGatewayAttachment;
}
export class Gateway extends Resource implements IGateway {

  public createInternetGateway(props: InternetGatewayProps) {
    const igw = new CfnInternetGateway(this.scope, 'InternetGateway', {});
    new CfnVPCGatewayAttachment(this.scope, 'VpcGatewayAttachment', {
      vpcId: props.vpcId,
      internetGatewayId: igw.ref,
    });
    return igw.ref;
  }

  public createNatGateway(props: NatGatewayProps) {
    const azName: string[] = this.getAvailabilityZoneNames();
    const natGatewayIds: string[] = [];
    for (let i = 0; i < azName.length; i++) {
      const eip = new CfnEIP(this.scope, `ElasticIp${azName[i]}`, {
        domain: 'vpc',
      });
      const natGateway = new CfnNatGateway(this.scope, `NatGateway${azName[i]}`, {
        allocationId: cdk.Fn.getAtt(eip.logicalId, 'AllocationId').toString(),
        subnetId: props.subnets.public[i],
      });
      natGatewayIds.push(natGateway.ref);
    }
    return natGatewayIds;
  }

  public createTransitGateway(props: TransitGatewayProps) {
    const tgw = new CfnTransitGateway(this.scope, 'TransitGateway', {
      autoAcceptSharedAttachments: 'enable',
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
      tags: [{ key: 'Name', value: 'main' }],
    });
    new CfnResourceShare(this.scope, 'ResourceShare', {
      name: 'TransitGateway',
      principals: props.principal.secondary.accountIds,
      resourceArns: [
        `arn:aws:ec2:${this.stack.region}:${this.stack.account}:transit-gateway/${cdk.Fn.getAtt(tgw.logicalId, 'Id').toString()}`,
      ]
    });
    new cdk.CfnOutput(this.scope, `ExportTransitGateway`, {
      value: cdk.Fn.getAtt(tgw.logicalId, 'Id').toString(),
      exportName: `${props.projectName}:TransitGateway`,
    });
    return cdk.Fn.getAtt(tgw.logicalId, 'Id').toString();
  }

  public attachTransitGateway(props: AttachTransitGatewayProps) {
    const attachment = new CfnTransitGatewayAttachment(this.scope, `TransitGatewayAttachment`, {
      transitGatewayId: props.transitGatewayId,
      vpcId: props.vpcId,
      subnetIds: props.subnets.private,
    });
    new cdk.CfnOutput(this.scope, `ExportTransitGatewayAttachment`, {
      value: attachment.ref,
      exportName: `${props.projectName}:TransitGatewayAttachment`,
    });
    return attachment;
  }
}
