import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
// import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');

export interface PipelineStackProps extends cdk.StackProps {
  readonly githubToken: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // SOURCE STAGE -------------------------------------------------
    // The code that defines your stack goes here
    const artifactsBucket = new s3.Bucket(this, "ArtifactsBucket");

    // Import existing CodeCommit sam-app repository
    // const codeRepo = codecommit.Repository.fromRepositoryName(
    //   this,
    //   'AppRepository', // Logical name within CloudFormation
    //   'sam-app' // Repository name
    // );

    // Pipeline creation starts
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactsBucket
    });

    // Declare source code as an artifact
    const sourceOutput = new codepipeline.Artifact();

    // Add source stage to pipeline
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'Checkout',
          owner: "andrea-velasquez",
          repo: "first-aws-sam-app",
          oauthToken: cdk.SecretValue.plainText(props.githubToken),
          trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
          output: sourceOutput,
        }),
      ],
    });

    // BUILD STAGE -------------------------------------------------
    // Declare build output as artifacts
    const buildOutput = new codepipeline.Artifact();

    // Declare a new CodeBuild project
    const buildProject = new codebuild.PipelineProject(this, 'Build', {
      environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2 },
      environmentVariables: {
        'PACKAGE_BUCKET': {
          value: artifactsBucket.bucketName
        }
      }
    });

    // Add the build stage to our pipeline
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // DEPLOY STAGE -------------------------------------------------
    pipeline.addStage({
      stageName: 'Dev',
      actions: [
        new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
          actionName: 'CreateChangeSet',
          templatePath: buildOutput.atPath("packaged.yaml"),
          stackName: 'first-aws-sam-app',
          adminPermissions: true,
          changeSetName: 'first-aws-sam-app-dev-changeset',
          runOrder: 1
        }),
        new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
          actionName: 'CreateChangeSet',
          templatePath: buildOutput.atPath("quarkus-packaged.yaml"),
          stackName: 'first-aws-sam-app',
          adminPermissions: true,
          changeSetName: 'first-aws-sam-app-dev-changeset',
          runOrder: 2
        }),
        new codepipeline_actions.CloudFormationExecuteChangeSetAction({
          actionName: 'Deploy',
          stackName: 'first-aws-sam-app',
          changeSetName: 'first-aws-sam-app-dev-changeset',
          runOrder: 3
        }),
      ],
    });
  }
}