define([
        'base/js/namespace',
        'base/js/dialog',
        'jquery',
        'require',
        'notebook/js/textcell',
        'base/js/utils',
        "nbextensions/ma/client/common/js/helper",
        "nbextensions/ma/client/common/js/googledrive/gdapi",
        "nbextensions/ma/client/common/js/gmail/gmailapi"
    ], function (IPython, dialog, $, require, textcell, utils, helper, gdapi, gmailapi) {
        "use strict";

        var isMergeReady = false;

        var load_ipython_extension = function () {
            IPython.toolbar.add_buttons_group([
                {
                    id: 'merge_ready',
                    label: 'Save and mark notebook as ready to merge',
                    icon: 'fa-code-fork',
                    callback: saveAndToggleMergeReady
                }
            ]);

            $(function () {
                initToggleIcon();
            });

        };

        var setIcon = function () {
             if (isMergeReady) {
                 $("#merge_ready").removeClass("btn-default").addClass("btn-success");
             } else {
                 $("#merge_ready").removeClass("btn-success").addClass("btn-default");
             }
        };

        var count = 50;

        var initToggleIcon = function () {
            if (!IPython.notebook.metadata.pgid || !IPython.notebook.metadata.id) {//we want it to match
		if(count-- > 0) {
                  setTimeout(initToggleIcon, 100);//wait n millisecnds then recheck
                  return;
                } else {
 			$('#merge_ready').hide();
			return;
                }
            }
            loadToggleIcon();
        };

        var loadToggleIcon = function () {
            $.ajax({
                url: "/merge/" + IPython.notebook.metadata.pgid + "/" + IPython.notebook.metadata.id,
                format: 'json',
                dataType: 'json',
                contentType: "application/json",
                type: 'GET',
                success: function (data) {
                    isMergeReady = data.last_merge_date ? true : false;
                    setIcon();
                }
            });
        };

        var saveAndToggleMergeReady = function () {
            var prompt = "";

            if (isMergeReady) {
                prompt = "Are you sure you want to mark this notebook as no longer merge ready?";
            } else {
                prompt = "Are you sure you want to mark this notebook as merge ready and inform the manager?";
            }

            var p = $('<p/>').text(prompt);
            var div = $('<div/>');
            div.append(p);

            IPython.dialog.modal({
                title: "Notebook Stats",
                body: div,
                buttons: {
                    "OK": {
                        class: 'btn-primary',
                        click: doMerge
                    },
                    "Cancel": {}
                }
            });
        };


        var doMerge = function () {
            console.info("Merge operation initiated");
            var event;
            var requestType;
            isMergeReady = !isMergeReady;

            if (isMergeReady) {
                IPython.notebook.save_checkpoint();
                event = {
                    "gid": IPython.notebook.metadata.pgid,
                    "type": "merge ready",
                    "obj_type": "notebook",
                    "obj_id": IPython.notebook.metadata.id,
                    "obj_name": '',
                    "obj_value": '',
                    "user": gdapi.getCurrentUser().name
                };
                requestType = "POST";

            } else {
                event = {
                    "gid": IPython.notebook.metadata.pgid,
                    "type": "merge not ready",
                    "obj_type": "notebook",
                    "obj_id": IPython.notebook.metadata.id,
                    "obj_name": '',
                    "obj_value": '',
                    "user": gdapi.getCurrentUser().name
                };
                requestType = "DELETE";

            }


            $.ajax({
                url: "/merge/" + IPython.notebook.metadata.pgid + "/" + IPython.notebook.metadata.id,
                contentType: 'application/json,charset=UTF-8',
                type: requestType
            });

            setIcon();

            helper.addEvent(event);

            if(isMergeReady) { // Was merge ready
                notifyOwner();
            }
        };


        var notifyOwner = function () {
            $.ajax({
                url: "/merge/" + IPython.notebook.metadata.pgid + "/" + IPython.notebook.metadata.id,
                format: 'json',
                dataType: 'json',
                contentType: "application/json",
                type: 'GET',
                success: function (data) {
                    getProjectAndNotifyOwner(data.all_mergeable);
                }
            });
        };

        var getProjectAndNotifyOwner = function (all_mergeable) {
            $.ajax({
                url: "/distprojects/" + IPython.notebook.metadata.pgid,
                format: 'json',
                dataType: 'json',
                contentType: "application/json",
                type: 'GET',
                data: {'username': gdapi.getCurrentUser().id},
                success: function (data) {
                    var mailText = 'The following notebook was marked as mergeable: ' + document.URL;
                    if (all_mergeable) {
                        mailText += '\r\n\r\nAll notebooks from this project are now mergeable.';
                    }
                    gmailapi.send_mail(data.owner, 'Notebook from \"' + data.name + '\" mergeable', mailText);
                }
            });

        };

        return {
            load_ipython_extension: load_ipython_extension
        };
    }
);
