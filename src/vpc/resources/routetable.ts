import * as cdk from '@aws-cdk/core';
import { Resource } from '../resource';
import { VpcRouteTable } from './routetable/vpc';
import { TgwRouteTable } from './routetable/tgw';

interface Props {
  projectName: string;
  vpcId: string;
  internetGatewayId: string;
  natGatewayIds: string[];
  transitGatewayId: string;
  attachment?: cdk.CfnResource;
  subnets: {
    public: string[];
    private: string[];
  };
  principal: {
    primary: {
      transitGatewayId: string;
    };
    secondary: {
      cidrBlock: string[];
      tgwAttachmentIds: string[];
    };
  };
}
interface IRouteTable {
  createResources(props: Props): void;
}
export class RouteTable extends Resource implements IRouteTable {
  public createResources(props: Props): void {
    const vpcRouteTable = new VpcRouteTable(this.scope);
    vpcRouteTable.createResources({
      projectName: props.projectName, vpcId: props.vpcId, internetGatewayId: props.internetGatewayId, natGatewayIds: props.natGatewayIds, transitGatewayId: props.transitGatewayId,
      subnets: { public: props.subnets.public, private: props.subnets.private },
      principal: { cidrBlock: props.principal.secondary.cidrBlock, transitGatewayId: props.principal.primary.transitGatewayId },
      attachement: props.attachment
    });

    const tgwRouteTable = new TgwRouteTable(this.scope);
    tgwRouteTable.createResources({
      projectName: props.projectName, transitGatewayId: props.transitGatewayId,
      principal: { tgwAttachmentIds: props.principal.secondary.tgwAttachmentIds },
      attachement: props.attachment
    });
  }
}
