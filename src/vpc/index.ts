import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface IVpc {
}
export interface Props {
  availabilityZones?: string[]
  cidr?: string
  maxAzs?: number
  subnetConfiguration?: ec2.VpcProps['subnetConfiguration']
}
export class Vpc extends Construct implements IVpc {

  /**
 * Vpc creates a VPC that spans a whole region.
 * It will automatically divide the provided VPC CIDR range, and create public and private subnets per Availability Zone.
 * Network routing for the public subnets will be configured to allow outbound access directly via an Internet Gateway.
 * Network routing for the private subnets will be configured to allow outbound access via a set of resilient NAT Gateways (one per AZ).
 */
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    this.vpc(scope, id, props)
  }

  private vpc(scope: Construct, id: string, props: Props) {
    const vpc = new ec2.Vpc(scope, `Vpc-${id}`, {
      vpcName: id,
      cidr: props.cidr,
      availabilityZones: props.availabilityZones,
      subnetConfiguration: props.subnetConfiguration,
      gatewayEndpoints: {
        s3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        }
      },
      natGatewayProvider: ec2.NatProvider.gateway(),
    })
  }
}
