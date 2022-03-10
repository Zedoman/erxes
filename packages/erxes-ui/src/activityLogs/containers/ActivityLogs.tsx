import { AppConsumer } from '../../appContext';
import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import React from 'react';
import { graphql } from 'react-apollo';
import { IUser } from '../../auth/types';
import { withProps } from '../../utils';
import ActivityLogs from '../components/ActivityLogs';
import { queries, subscriptions } from '../graphql';
import { ActivityLogQueryResponse, IActivityLog } from '../types';

export type ActivityLogsProps = {
  contentId: string;
  contentType: string;
  target?: string;
  extraTabs: Array<{ name: string; label: string }>;
  activityRenderItem?: (
    activity: IActivityLog,
    currentUser?: IUser
  ) => React.ReactNode;
};

type FinalProps = {
  activityLogQuery: ActivityLogQueryResponse;
} & WithDataProps;

class Container extends React.Component<FinalProps, {}> {
  private unsubscribe;

  componentDidMount() {
    const { activityLogQuery } = this.props;

    this.unsubscribe = activityLogQuery.subscribeToMore({
      document: gql(subscriptions.activityLogsChanged),
      updateQuery: () => {
        this.props.activityLogQuery.refetch();
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activityType !== this.props.activityType) {
      this.props.activityLogQuery.refetch();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const {
      target,
      activityLogQuery,
      extraTabs,
      activityRenderItem,
      contentId,
      contentType
    } = this.props;

    const props = {
      target,
      loadingLogs: activityLogQuery.loading,
      activityLogs: activityLogQuery.activityLogs || [],
      extraTabs,
      activityRenderItem,
      contentId,
      contentType
    };

    return (
      <AppConsumer>
        {({ currentUser }) => (
          <ActivityLogs
            {...props}
            currentUser={currentUser || ({} as IUser)}
            activityRenderItem={activityRenderItem}
          />
        )}
      </AppConsumer>
    );
  }
}

type WithDataProps = ActivityLogsProps & {
  activityType: string;
};

const WithData = withProps<WithDataProps>(
  compose(
    graphql<WithDataProps, ActivityLogQueryResponse>(
      gql(queries.activityLogs),
      {
        name: 'activityLogQuery',
        options: ({ contentId, contentType, activityType }: WithDataProps) => ({
          variables: { contentId, contentType, activityType }
        })
      }
    ),
  )(Container)
);

export default class Wrapper extends React.Component<
  ActivityLogsProps,
  { activityType: string }
> {
  constructor(props) {
    super(props);

    this.state = {
      activityType: 'activity'
    };
  }

  render() {
    const {
      contentId,
      contentType,
      target,
      extraTabs,
      activityRenderItem
    } = this.props;
    const { activityType } = this.state;

    return (
      <WithData
        target={target}
        contentId={contentId}
        contentType={contentType}
        extraTabs={extraTabs}
        activityType={activityType}
        activityRenderItem={activityRenderItem}
      />
    );
  }
}
