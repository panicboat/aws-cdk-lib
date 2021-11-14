# CodePipeline for ECS

## Require

### The `CICredential` are registered in AWS Secrets Manager.

```json
{
  "GitHubAccessToken": "Personal Access Token for GitHub",
  "DockerHubID": "Docker ID for Docker Hub",
  "DockerHubPassword": "Password for Docker Hub"
}
```

### Create S3 Bucket

```typescript
const artifactBucket = new Bucket(this, `ArtifactBucket-${process.env.PROJECT_NAME}`, { bucketName: process.env.ARTIFACT_BUCKET! });
const cacheBucket = new Bucket(this, `CacheBucket-${process.env.PROJECT_NAME}`, { bucketName: process.env.BUILD_CACHE_BUCKET! });
```

### Create ECR Repository

#### Use GitHubSourceAction

```typescript
new ecr.Repository(this, id, { repositoryName: process.env.REPOSITORY_NAME! });
```

#### Use EcrSourceAction

```typescript
const repository = new ecr.Repository(this, id, { repositoryName: process.env.REPOSITORY_NAME! });
const policy = new PolicyStatement({
  effect: Effect.ALLOW,
  principals: [new AccountPrincipal(process.env.SOURCE_ACCOUNT_ID!)],
  actions: [
    'ecr:GetDownloadUrlForLayer',
    'ecr:BatchGetImage',
    'ecr:BatchCheckLayerAvailability',
    'ecr:PutImage',
    'ecr:InitiateLayerUpload',
    'ecr:UploadLayerPart',
    'ecr:CompleteLayerUpload'
  ],
});
repository.addToResourcePolicy(policy);
```

## Example

### GitHubSourceAction

```typescript

```

### EcrSourceAction

```typescript

```
