import { CfnVPCEndpoint } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  subnets: {
    protected: string[],
  },
  securityGroupIds: string[];
  endpoints: { serviceName: string; privateDnsEnabled: boolean }[];
}
interface IEndpoint {
  createResources(props: Props): void;
}
export class Endpoint extends Resource implements IEndpoint {
  public createResources(props: Props): void {
    let endpoints: { serviceName: string; privateDnsEnabled: boolean }[] = [
      { serviceName: 'ssm', privateDnsEnabled: true },
      { serviceName: 'ssmmessages', privateDnsEnabled: true },
      { serviceName: 'ec2messages', privateDnsEnabled: true },
      // { serviceName: 's3', privateDnsEnabled: false },
      { serviceName: 'ecr.dkr', privateDnsEnabled: false },
      { serviceName: 'ecr.api', privateDnsEnabled: false },
    ].concat(props.endpoints);
    endpoints.forEach(endpoint => {
      new CfnVPCEndpoint(this.scope, `VpcEndpoint-${endpoint.serviceName}`, {
        serviceName: `com.amazonaws.${this.stack.region}.${endpoint.serviceName}`,
        vpcId: props.vpcId,
        privateDnsEnabled: endpoint.privateDnsEnabled,
        securityGroupIds: props.securityGroupIds,
        subnetIds: props.subnets.protected,
        vpcEndpointType: 'Interface',
      });
    });
  }
}
