import * as cdk from '@aws-cdk/core';
import { CfnRoute, CfnRouteTable, CfnSubnetRouteTableAssociation } from '@aws-cdk/aws-ec2';
import { Resource } from '../../resource';

interface Props {
  projectName: string;
  vpcId: string;
  internetGatewayId: string;
  natGatewayIds: string[];
  transitGatewayId: string;
  subnets: {
    public: string[],
    private: string[],
  };
  principal: {
    vpcCidrBlock: string[];
    transitGatewayId: string;
  };
  attachement?: cdk.CfnResource;
}
interface IRouteTable {
  createResources(props: Props): void;
}
export class VpcRouteTable extends Resource implements IRouteTable {
  public createResources(props: Props): void {
    this.createPublicTable(this.scope, props);
    this.createPrivateTable(this.scope, props);
  }

  private createPublicTable(scope: cdk.Construct, props: Props): void {
    const routetable = new CfnRouteTable(scope, 'PublicRouteTable', {
      vpcId: props.vpcId
    });
    new CfnRoute(scope, 'PublicRoute', {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: props.internetGatewayId,
      routeTableId: routetable.ref,
    });
    for (let j = 0; j < props.principal.vpcCidrBlock.length; j++) {
      // For primary account
      const route = new CfnRoute(scope, `PublicRouteTableTgw${props.principal.vpcCidrBlock[j]}`, {
        destinationCidrBlock: props.principal.vpcCidrBlock[j],
        transitGatewayId: props.transitGatewayId,
        routeTableId: routetable.ref,
      });
      if (props.attachement !== undefined) {
        route.addDependsOn(props.attachement);
      }
    }
    for (let i = 0; i < this.getAvailabilityZoneNames().length; i++) {
      new CfnSubnetRouteTableAssociation(scope, `PublicAssociation${this.getAvailabilityZoneNames()[i]}`, {
        routeTableId: routetable.ref,
        subnetId: props.subnets.public[i],
      });
    }
  }

  private createPrivateTable(scope: cdk.Construct, props: Props): void {
    for (let i = 0; i < this.getAvailabilityZoneNames().length; i++) {
      const routetable = new CfnRouteTable(scope, `ProtectedRouteTable${this.getAvailabilityZoneNames()[i]}`, {
        vpcId: props.vpcId,
      });
      if (0 < props.natGatewayIds.length) {
        // For primary account
        new CfnRoute(scope, `ProtectedRouteNgw${this.getAvailabilityZoneNames()[i]}`, {
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: props.natGatewayIds[i],
          routeTableId: routetable.ref,
        });
      } else if (0 < props.principal.transitGatewayId.length) {
        // For secondary accounts
        const route = new CfnRoute(scope, `ProtectedRoute${this.getAvailabilityZoneNames()[i]}`, {
          destinationCidrBlock: '0.0.0.0/0',
          transitGatewayId: props.principal.transitGatewayId,
          routeTableId: routetable.ref,
        });
        if (props.attachement !== undefined) {
          route.addDependsOn(props.attachement);
        }
      }
      new CfnSubnetRouteTableAssociation(scope, `ProtectedAssociation${this.getAvailabilityZoneNames()[i]}`, {
        routeTableId: routetable.ref,
        subnetId: props.subnets.private[i],
      });
    }
  }
}
