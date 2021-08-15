import * as cdk from '@aws-cdk/core';
import { CfnTransitGatewayAttachment } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';
import { VpcRouteTable } from './route/vpc';
import { TgwRouteTable } from './route/tgw';

interface Props {
  projectName: string;
  vpcId: string;
  internetGatewayId: string;
  natGatewayIds: string[];
  transitGatewayId: string;
  subnets: {
    public: string[];
    protected: string[];
  };
  principal: {
    vpcCidrBlock: string[];
    transitGatewayId: string;
    tgwAttachmentIds: string[];
  };
}
interface IRouteTable {
  createResources(props: Props): void;
}
export class RouteTable extends Resource implements IRouteTable {
  public createResources(props: Props): void {
    let attachment!: cdk.CfnResource;
    if (0 < props.transitGatewayId.length) {
      // For master account
      attachment = this.createTransitGatewayAttachment(this.scope, props, props.transitGatewayId);
    }
    if (0 < props.principal.transitGatewayId.length) {
      // For child accounts
      attachment = this.createTransitGatewayAttachment(this.scope, props, props.principal.transitGatewayId);
    }

    const vpcRouteTable = new VpcRouteTable(this.scope);
    vpcRouteTable.createResources({
      projectName: props.projectName, vpcId: props.vpcId, internetGatewayId: props.internetGatewayId, natGatewayIds: props.natGatewayIds, transitGatewayId: props.transitGatewayId,
      subnets: { public: props.subnets.public, protected: props.subnets.protected },
      principal: { vpcCidrBlock: props.principal.vpcCidrBlock, transitGatewayId: props.principal.transitGatewayId },
      attachement: attachment
    });

    const tgwRouteTable = new TgwRouteTable(this.scope);
    tgwRouteTable.createResources({
      projectName: props.projectName, transitGatewayId: props.transitGatewayId,
      principal: { tgwAttachmentIds: props.principal.tgwAttachmentIds },
      attachement: attachment
    });
  }

  private createTransitGatewayAttachment(scope: cdk.Construct, props: Props, transitGatewayId: string): cdk.CfnResource {
    const attachment = new CfnTransitGatewayAttachment(scope, `TransitGatewayAttachment`, {
      transitGatewayId: transitGatewayId,
      vpcId: props.vpcId,
      subnetIds: props.subnets.protected,
    });
    new cdk.CfnOutput(scope, `ExportTransitGatewayAttachment`, {
      value: attachment.ref,
      exportName: `${props.projectName}:TransitGatewayAttachment`,
    });
    return attachment;
  }
}
