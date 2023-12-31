import { t } from 'i18next';

import { ThunkResult } from '@/js/store';
import { Epic } from '@/js/store/epics/reducer';
import { isCurrentUser } from '@/js/store/helpers';
import { addToast } from '@/js/store/toasts/actions';

interface EpicCreated {
  type: 'EPIC_CREATE';
  payload: Epic;
}
interface EpicUpdated {
  type: 'EPIC_UPDATE';
  payload: Epic;
}
interface EpicCreatePRFailed {
  type: 'EPIC_CREATE_PR_FAILED';
  payload: Epic;
}

export type EpicAction = EpicCreated | EpicUpdated | EpicCreatePRFailed;

export const createEpic = (payload: Epic): EpicCreated => ({
  type: 'EPIC_CREATE',
  payload,
});

export const updateEpic = (payload: Epic): EpicUpdated => ({
  type: 'EPIC_UPDATE',
  payload,
});

export const createEpicPR =
  ({
    model,
    originating_user_id,
  }: {
    model: Epic;
    originating_user_id: string | null;
  }): ThunkResult<EpicUpdated> =>
  (dispatch, getState) => {
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Successfully submitted Epic for review on GitHub: “{{epic_name}}.”',
            { epic_name: model.name },
          ),
          linkText: model.pr_url ? t('View pull request.') : undefined,
          linkUrl: model.pr_url ? model.pr_url : undefined,
          openLinkInNewWindow: true,
        }),
      );
    }

    return dispatch({
      type: 'EPIC_UPDATE' as const,
      payload: model,
    });
  };

export const createEpicPRFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Epic;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<EpicCreatePRFailed> =>
  (dispatch, getState) => {
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: t(
            'Uh oh. There was an error submitting Epic for review on GitHub: “{{epic_name}}.”',
            { epic_name: model.name },
          ),
          details: message,
          variant: 'error',
        }),
      );
    }
    return dispatch({
      type: 'EPIC_CREATE_PR_FAILED' as const,
      payload: model,
    });
  };
