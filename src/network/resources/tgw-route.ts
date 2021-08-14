import * as cdk from '@aws-cdk/core';
import { CfnTransitGatewayRoute, CfnTransitGatewayRouteTable, CfnTransitGatewayRouteTableAssociation, CfnTransitGatewayRouteTablePropagation } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  transitGatewayId: string;
  tgwAttachmentId: string;
  principal: {
    tgwAttachmentIds: string[];
  }
}
interface IRouteTable {
  createResources(props: Props): void;
}
export class TgwRouteTable extends Resource implements IRouteTable {

  public createResources(props: Props): void {
    if (0 < props.transitGatewayId.length) {
      // For master account
      const routetable = new CfnTransitGatewayRouteTable(this.scope, 'TransitGatewayRouteTable', {
        transitGatewayId: props.transitGatewayId,
      });
      this.tgwRouteTableAssociation('', props.tgwAttachmentId, routetable.ref);
      for (let i = 0; i < props.principal.tgwAttachmentIds.length; i++) {
        this.tgwRouteTableAssociation(props.principal.tgwAttachmentIds[i], props.principal.tgwAttachmentIds[i], routetable.ref);
      }
      new CfnTransitGatewayRoute(this.scope, 'TransitGatewayRoute', {
        destinationCidrBlock: '0.0.0.0/0',
        transitGatewayAttachmentId: props.tgwAttachmentId,
        transitGatewayRouteTableId: routetable.ref,
      });
    }
  }

  private tgwRouteTableAssociation(id: string, transitGatewayAttachmentId: string, transitGatewayRouteTableId: string): void {
    new CfnTransitGatewayRouteTableAssociation(this.scope, `TransitGatewayRouteTableAssociation${id}`, {
      transitGatewayAttachmentId: transitGatewayAttachmentId,
      transitGatewayRouteTableId: transitGatewayRouteTableId,
    });
    new CfnTransitGatewayRouteTablePropagation(this.scope, `TransitGatewayRouteTablePropagation${id}`, {
      transitGatewayAttachmentId: transitGatewayAttachmentId,
      transitGatewayRouteTableId: transitGatewayRouteTableId,
    });
  }
}
