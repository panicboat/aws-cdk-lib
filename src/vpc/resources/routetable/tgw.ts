import * as cdk from '@aws-cdk/core';
import { CfnTransitGatewayRoute, CfnTransitGatewayRouteTable, CfnTransitGatewayRouteTableAssociation, CfnTransitGatewayRouteTablePropagation } from '@aws-cdk/aws-ec2';
import { Resource } from '../../resource';

interface Props {
  projectName: string;
  transitGatewayId: string;
  principal: {
    tgwAttachmentIds: string[];
  };
  attachement?: cdk.CfnResource;
}
interface IRouteTable {
  createResources(props: Props): void;
}
export class TgwRouteTable extends Resource implements IRouteTable {
  public createResources(props: Props): void {
    if (0 < props.transitGatewayId.length) {
      // For primary account
      const routetable = new CfnTransitGatewayRouteTable(this.scope, 'TransitGatewayRouteTable', {
        transitGatewayId: props.transitGatewayId,
      });
      if (props.attachement !== undefined) {
        this.tgwRouteTableAssociation('', props.attachement.ref, routetable.ref);
      }
      props.principal.tgwAttachmentIds.forEach(tgwAttachmentId => {
        this.tgwRouteTableAssociation(tgwAttachmentId, tgwAttachmentId, routetable.ref);
      });
      if (props.attachement !== undefined) {
        new CfnTransitGatewayRoute(this.scope, 'TransitGatewayRoute', {
          destinationCidrBlock: '0.0.0.0/0',
          transitGatewayAttachmentId: props.attachement.ref,
          transitGatewayRouteTableId: routetable.ref,
        });
      }
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
