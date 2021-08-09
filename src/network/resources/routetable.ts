import * as cdk from '@aws-cdk/core';
import { CfnRoute, CfnRouteTable, CfnSubnetRouteTableAssociation } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  gatewayId: string;
  natGatewayId: string[];
  subnets: {
    public: string[],
    protected: string[],
  }
}
interface IRouteTable {
  createResources(props: Props): void;
}
export class RouteTable extends Resource implements IRouteTable {

  public createResources(props: Props): void {
    this.publicTable(this.scope, props.vpcId, props.gatewayId, props.subnets.public);
    this.protectedTable(this.scope, props.vpcId, props.natGatewayId, props.subnets.protected);
  }

  private publicTable(scope: cdk.Construct, vpcId: string, gatewayId: string, subnets: string[]): void {
    const routetable = new CfnRouteTable(scope, 'PublicRouteTable', {
      vpcId: vpcId
    });
    new CfnRoute(scope, 'PublicRoute', {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: gatewayId,
      routeTableId: routetable.ref,
    });
    let azName: string[] = this.getAvailabilityZoneNames();
    for (let i = 0; i < azName.length; i++) {
      new CfnSubnetRouteTableAssociation(scope, `PublicAssociation${azName[i]}`, {
        routeTableId: routetable.ref,
        subnetId: subnets[i],
      });
    }
  }

  private protectedTable(scope: cdk.Construct, vpcId: string, natGatewayId: string[], subnets: string[]): void {
    let azName: string[] = this.getAvailabilityZoneNames();
    for (let i = 0; i < azName.length; i++) {
      const routetable = new CfnRouteTable(scope, `ProtectedRouteTable${azName[i]}`, {
        vpcId: vpcId
      });
      new CfnRoute(scope, `ProtectedRoute${azName[i]}`, {
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGatewayId[i],
        routeTableId: routetable.ref,
      });
      new CfnSubnetRouteTableAssociation(scope, `ProtectedAssociation${azName[i]}`, {
        routeTableId: routetable.ref,
        subnetId: subnets[i],
      });
    }
  }
}
