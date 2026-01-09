module Api
  module V1
    module Admin
      class ProjectsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        # GET /api/v1/admin/projects
        def index
          projects = Project.includes(:user, :created_by).order(created_at: :desc)
          render json: projects.map { |p| project_json(p) }, status: :ok
        end

        # GET /api/v1/admin/projects/:id
        def show
          project = Project.includes(:user, :created_by).find_by(id: params[:id])

          if project
            render json: project_json(project), status: :ok
          else
            render json: { error: "Project not found" }, status: :not_found
          end
        end

        # PATCH/PUT /api/v1/admin/projects/:id
        def update
          project = Project.find_by(id: params[:id])
          return render json: { error: "Project not found" }, status: :not_found unless project

          if project.update(project_params)
            # reload associations so JSON includes updated user/created_by
            project.reload
            render json: project_json(project), status: :ok
          else
            render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def project_params
          params.require(:project).permit(
            :name,
            :status,
            :location,
            :install_date,
            :install_slot,
            :description,
            :user_id
            # NOTE: we are NOT permitting :created_by_id here on purpose.
            # Assignee should be set automatically at creation time (created_by = current_user).
          )
        end

        def project_json(project)
          {
            id: project.id,
            name: project.name,
            status: project.status,
            location: project.location,
            install_date: project.install_date,
            install_slot: project.install_slot,
            description: project.description,

            user: project.user && {
              id: project.user.id,
              name: project.user.name,
              email: project.user.email
            },

            # ✅ Assignee / Creator
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
