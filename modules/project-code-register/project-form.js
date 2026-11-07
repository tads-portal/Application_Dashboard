import { openModal, buildButton } from "../../js/components/modal.js";
import { renderDynamicForm, collectFormValues, applyFormErrors } from "../../js/components/form.js";
import { getActiveFieldDefinitions } from "../../js/services/configuration-service.js";
import { createProject, updateProject } from "../../js/services/project-service.js";
import { showSuccess, showError } from "../../js/components/notification.js";
import { PROJECT_CODE_REGISTER_MODULE } from "../../data/seed-data.js";

/**
 * Opens the create/edit project modal.
 * @param {Object} [project] - existing project to edit; omit to create a new one
 * @returns {Promise<Object|null>} the saved project, or null if the user cancelled
 */
export async function openProjectForm(project = null) {
  const isEdit = Boolean(project);
  const allActiveFields = await getActiveFieldDefinitions(PROJECT_CODE_REGISTER_MODULE);
  const editableFields = allActiveFields.filter((f) => !f.system);

  return new Promise((resolve) => {
    const form = renderDynamicForm(editableFields, project || {});

    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const cancelBtn = buildButton("Cancel", {
      variant: "secondary",
      onClick: () => {
        settle(null);
        modalHandle.close();
      },
    });

    const resetBtn = buildButton("Reset", {
      variant: "ghost",
      onClick: () => {
        const fresh = renderDynamicForm(editableFields, isEdit ? project : {});
        modalHandle.bodyEl.replaceChildren(fresh);
      },
    });

    const saveBtn = buildButton(isEdit ? "Save Changes" : "Create Project", {
      variant: "primary",
      onClick: async () => {
        saveBtn.disabled = true;
        const currentForm = modalHandle.bodyEl.querySelector("form");
        const values = collectFormValues(currentForm, editableFields);
        try {
          const saved = isEdit ? await updateProject(project.id, values) : await createProject(values);
          showSuccess(isEdit ? `${saved.projectCode} updated.` : `${saved.projectCode} created.`);
          settle(saved);
          modalHandle.close();
        } catch (err) {
          if (err.fieldErrors) {
            applyFormErrors(currentForm, err.fieldErrors);
          } else {
            showError(err.message || "Could not save the project.");
          }
        } finally {
          saveBtn.disabled = false;
        }
      },
    });

    const footerButtons = isEdit ? [cancelBtn, saveBtn] : [cancelBtn, resetBtn, saveBtn];

    const modalHandle = openModal({
      title: isEdit ? `Edit ${project.projectCode}` : "New Project",
      body: form,
      size: "lg",
      footerButtons,
      onClose: () => settle(null),
    });
  });
}
