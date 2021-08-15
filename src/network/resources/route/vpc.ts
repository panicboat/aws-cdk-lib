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
    protected: string[],
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
    this.createProtectedTable(this.scope, props);
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
    let azName: string[] = this.getAvailabilityZoneNames();
    for (let i = 0; i < azName.length; i++) {
      new CfnSubnetRouteTableAssociation(scope, `PublicAssociation${azName[i]}`, {
        routeTableId: routetable.ref,
        subnetId: props.subnets.public[i],
      });
    }
  }

  private createProtectedTable(scope: cdk.Construct, props: Props): void {
    let azName: string[] = this.getAvailabilityZoneNames();
    for (let i = 0; i < azName.length; i++) {
      const routetable = new CfnRouteTable(scope, `ProtectedRouteTable${azName[i]}`, {
        vpcId: props.vpcId,
      });
      if (0 < props.natGatewayIds.length) {
        // For master account
        new CfnRoute(scope, `ProtectedRouteNgw${azName[i]}`, {
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: props.natGatewayIds[i],
          routeTableId: routetable.ref,
        });
        for (let j = 0; j < props.principal.vpcCidrBlock.length; j++) {
          const route = new CfnRoute(scope, `ProtectedRouteTgw${props.principal.vpcCidrBlock[j].replace(/[^0-9]/g, '')}-${i}`, {
            destinationCidrBlock: props.principal.vpcCidrBlock[j],
            transitGatewayId: props.transitGatewayId,
            routeTableId: routetable.ref,
          });
          if (props.attachement !== undefined) {
            route.addDependsOn(props.attachement);
          }
        }
      } else if (0 < props.principal.transitGatewayId.length) {
        // For child accounts
        const route = new CfnRoute(scope, `ProtectedRoute${azName[i]}`, {
          destinationCidrBlock: '0.0.0.0/0',
          transitGatewayId: props.principal.transitGatewayId,
          routeTableId: routetable.ref,
        });
        if (props.attachement !== undefined) {
          route.addDependsOn(props.attachement);
        }
      }
      new CfnSubnetRouteTableAssociation(scope, `ProtectedAssociation${azName[i]}`, {
        routeTableId: routetable.ref,
        subnetId: props.subnets.protected[i],
      });
    }
  }
}
