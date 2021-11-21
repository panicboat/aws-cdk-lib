import * as cdk from '@aws-cdk/core';
import { CfnRoute, CfnRouteTable, CfnSubnetRouteTableAssociation, CfnTransitGatewayRoute, CfnTransitGatewayRouteTable, CfnTransitGatewayRouteTableAssociation, CfnTransitGatewayRouteTablePropagation } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface IRouteTable {
  createVpcRoutePublic(props: { vpcId: string, internetGatewayId: string, subnets: { public: string[] }, principal: { primary: { transitGatewayId: string }, secondary: { cidrBlock: string[] } } }): CfnRoute[];
  createVpcRoutePrivate(props: { vpcId: string, subnets: { private: string[] }, principal: { primary: { natGatewayIds: string[], transitGatewayId: string } } }): CfnRoute[];
  createVpcRoutePrivate(props: { vpcId: string, subnets: { private: string[] }, principal: { primary: { natGatewayIds: string[], transitGatewayId: string } } }): void;
}
export class RouteTable extends Resource implements IRouteTable {

  public createVpcRoutePublic(props: { vpcId: string, internetGatewayId: string, subnets: { public: string[] }, principal: { primary: { transitGatewayId: string }, secondary: { cidrBlock: string[] } } }) {
    const routes: CfnRoute[] = [];
    const routetable = new CfnRouteTable(this.scope, 'PublicRouteTable', {
      vpcId: props.vpcId
    });
    new CfnRoute(this.scope, 'PublicRoute', {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: props.internetGatewayId,
      routeTableId: routetable.ref,
    });
    for (let j = 0; j < props.principal.secondary.cidrBlock.length; j++) {
      // For primary account
      const route = new CfnRoute(this.scope, `PublicRouteTableTgw${props.principal.secondary.cidrBlock[j]}`, {
        destinationCidrBlock: props.principal.secondary.cidrBlock[j],
        transitGatewayId: props.principal.primary.transitGatewayId,
        routeTableId: routetable.ref,
      });
      routes.push(route);
    }
    for (let i = 0; i < this.getAvailabilityZoneNames().length; i++) {
      new CfnSubnetRouteTableAssociation(this.scope, `PublicAssociation${this.getAvailabilityZoneNames()[i]}`, {
        routeTableId: routetable.ref,
        subnetId: props.subnets.public[i],
      });
    }
    return routes;
  }

  public createVpcRoutePrivate(props: { vpcId: string, subnets: { private: string[] }, principal: { primary: { natGatewayIds: string[], transitGatewayId: string } } }) {
    const routes: CfnRoute[] = [];
    for (let i = 0; i < this.getAvailabilityZoneNames().length; i++) {
      const routetable = new CfnRouteTable(this.scope, `ProtectedRouteTable${this.getAvailabilityZoneNames()[i]}`, {
        vpcId: props.vpcId,
      });
      if (props.principal.primary.natGatewayIds.length !== 0) {
        // For primary account
        new CfnRoute(this.scope, `ProtectedRouteNgw${this.getAvailabilityZoneNames()[i]}`, {
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: props.principal.primary.natGatewayIds[i],
          routeTableId: routetable.ref,
        });
      } else if (props.principal.primary.transitGatewayId.length !== 0) {
        // For secondary accounts
        const route = new CfnRoute(this.scope, `ProtectedRoute${this.getAvailabilityZoneNames()[i]}`, {
          destinationCidrBlock: '0.0.0.0/0',
          transitGatewayId: props.principal.primary.transitGatewayId,
          routeTableId: routetable.ref,
        });
        routes.push(route);
      }
      new CfnSubnetRouteTableAssociation(this.scope, `ProtectedAssociation${this.getAvailabilityZoneNames()[i]}`, {
        routeTableId: routetable.ref,
        subnetId: props.subnets.private[i],
      });
    }
    return routes;
  }

  public createTransitGatewayRoute(attachement: cdk.CfnResource, props: { principal: { primary: { transitGatewayId: string }, secondary: { transitGatewayAttachmentIds: string[] } } }) {
    const routetable = new CfnTransitGatewayRouteTable(this.scope, 'TransitGatewayRouteTable', {
      transitGatewayId: props.principal.primary.transitGatewayId,
    });
    if (attachement !== undefined) {
      this.tgwRouteTableAssociation('', attachement.ref, routetable.ref);
    }
    props.principal.secondary.transitGatewayAttachmentIds.forEach(transitGatewayAttachmentId => {
      this.tgwRouteTableAssociation(transitGatewayAttachmentId, transitGatewayAttachmentId, routetable.ref);
    });
    if (attachement !== undefined) {
      new CfnTransitGatewayRoute(this.scope, 'TransitGatewayRoute', {
        destinationCidrBlock: '0.0.0.0/0',
        transitGatewayAttachmentId: attachement.ref,
        transitGatewayRouteTableId: routetable.ref,
      });
    }
  }

  private tgwRouteTableAssociation(id: string, transitGatewayAttachmentId: string, transitGatewayRouteTableId: string) {
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
