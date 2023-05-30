import { LightningElement, api, wire } from 'lwc';
import { createRecord, updateRecord, deleteRecord, notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';


export default class SfpegActionButtonCmp extends  NavigationMixin(LightningElement) {

    //-----------------------------------------------------
    // Configuration parameters
    //-----------------------------------------------------
    @api buttonIcon;
    @api buttonIconPosition = 'left';
    @api buttonLabel;
    @api buttonTitle;
    @api buttonSize = 'medium';
    @api buttonVariant = 'primary';
    @api buttonInactive = 'false';

    @api buttonAction;

    @api isDebug = false;

    //-----------------------------------------------------
    // Configuration parameters
    //-----------------------------------------------------
    isInactive = false;
    buttonClass = 'fr-btn';

    //-----------------------------------------------------
    // Initialisation
    //-----------------------------------------------------
    connectedCallback() {
        if (this.isDebug) {
            console.log('connected: START action button for ',this.buttonLabel);
            console.log('connected: button title ',this.buttonTitle);
            console.log('connected: button icon ',this.buttonIcon);
            console.log('connected: button icon position ',this.buttonIconPosition);
            console.log('connected: button variant ',this.buttonVariant);
            console.log('connected: button size ',this.buttonSize);
            console.log('connected: button action ',this.buttonAction);
            console.log('connected: button inactive? ', this.buttonInactive);
        }

        if (this.isDebug) console.log('connected: END action button');
    }

    //-----------------------------------------------------
    // Event Handlers
    //-----------------------------------------------------
    handleAction(event) {
        if (this.isDebug) console.log('handleAction: START for button ',this.buttonLabel);
        if (this.isDebug) console.log('handleAction: event ',event);

        if (this.isDebug) console.log('handleAction: action fetched ',this.buttonAction);
        if (this.buttonAction) {
            const actionDetails = JSON.parse(this.buttonAction);
            if (this.isDebug) console.log('handleAction: actionDetails parsed ',actionDetails);

            let actionPromise;
            switch (actionDetails.type) {
                case 'create':
                    if (this.isDebug) console.log('handleAction: triggering create action',JSON.stringify(actionDetails.params));
                    actionPromise = createRecord(actionDetails.params);
                    break;
                case 'update':
                    if (this.isDebug) console.log('handleAction: triggering update action',JSON.stringify(actionDetails.params));
                    actionPromise = updateRecord(actionDetails.params);
                    break;
                case 'delete':
                    if (this.isDebug) console.log('handleAction: triggering delete action',JSON.stringify(actionDetails.params));
                    actionPromise = deleteRecord(actionDetails.params);
                    break;
                default:
                    console.warn('handleAction: END KO / Unsupported action type');
                    return;
            }

            actionPromise.then(data => {
                if (this.isDebug) console.log('handleAction: operation executed ', JSON.stringify(data));
                if ((actionDetails.navigate) && (data.recordId)) {
                    if (this.isDebug) console.log('handleAction: navigating to record');
                    const newRecordPageRef = {
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: data.recordId,
                            objectApiName: actionDetails.params.apiName,
                            actionName: 'view'
                        }
                    }
                    if (this.isDebug) console.log('handleAction: END / Navigating to ',newRecordPageRef);
                    this[NavigationMixin.Navigate](newRecordPageRef);
                }
                else if (actionDetails.reload) {
                    if (this.isDebug) console.log('handleAction: END / Triggering record data reload on ',actionDetails.reload);
                    notifyRecordUpdateAvailable(actionDetails.reload);
                }
                else if (this.isDebug) console.log('handleAction: END');
            }).catch(error => {
                console.warn('handleAction: action failed ',error);
                let alertConfig = {alerts:[],size:'small'};
                if (error.body?.output?.errors) {
                    alertConfig.header = error.body?.message;
                    error.body.output.errors.forEach(item => {
                        alertConfig.alerts.push({type:'error', message: item.message});
                    })
                }
                else {
                    alertConfig.alerts.push({type:'error', message: (error.body?.message || error.statusText)});
                }
                console.warn('handleAction: alertConfig init ', JSON.stringify(alertConfig));

                let popupUtil = this.template.querySelector('c-dsfr-alert-popup-dsp');
                console.warn('handleAction: popupUtil fetched ', popupUtil);
                popupUtil.showAlert(alertConfig).then(() => {
                    if (this.isDebug) console.log('handleAction: END / popup closed');
                });
            });
            
            if (this.isDebug) console.log('handleAction: action trigered');
        }
    }
}