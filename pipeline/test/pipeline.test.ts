import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Pipeline from '../lib/pipeline-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    if (!process.env.GITHUB_TOKEN) {
      console.log("No Github Token present");
    }
    // WHEN
    const stack = new Pipeline.PipelineStack(app, 'MyTestStack', {
      githubToken: process.env.GITHUB_TOKEN || ""
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});