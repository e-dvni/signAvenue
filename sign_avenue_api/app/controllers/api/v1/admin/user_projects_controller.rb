module Api
  module V1
    module Admin
      class UserProjectsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        # POST /api/v1/admin/users/:user_id/projects
        # Accepts either JSON (no files) or multipart/form-data with files[]
        def create
          user = User.find_by(id: params[:user_id])
          return render json: { error: "User not found" }, status: :not_found unless user

          project = user.projects.build(project_params)

          # ✅ NEW: Assign creator/assignee (admin who created the project)
          project.created_by = current_user

          if project.save
            # Attach any uploaded files (multipart form-data: files[])
            if params[:files].present?
              Array(params[:files]).each { |f| project.files.attach(f) }
            end

            render json: {
              message: "Project created",
              project: project_json(project)
            }, status: :created
          else
            render json: { error: project.errors.full_messages.to_sentence }, status: :unprocessable_entity
          end
        end

        private

        def project_params
          params.require(:project).permit(
            :name,
            :status,
            :location,
            :description
          )
        end

        def project_json(project)
          {
            id: project.id,
            name: project.name,
            status: project.status,
            location: project.location,
            description: project.description,
            install_date: project.install_date,
            install_slot: project.install_slot,

            # ✅ NEW: include assignee/creator in response
            created_by: project.created_by && {
              id: project.created_by.id,
              name: project.created_by.name,
              email: project.created_by.email
            },

            created_at: project.created_at,
            updated_at: project.updated_at
          }
        end
      end
    end
  end
end
