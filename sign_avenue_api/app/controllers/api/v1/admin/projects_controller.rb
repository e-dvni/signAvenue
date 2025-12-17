module Api
  module V1
    module Admin
      class ProjectsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        # GET /api/v1/admin/projects
        def index
          projects = Project.includes(:user).order(created_at: :desc)

          render json: projects.map { |p| project_json(p) }, status: :ok
        end

        # GET /api/v1/admin/projects/:id
        def show
          project = Project.includes(:user).find_by(id: params[:id])

          if project
            render json: project_json(project), status: :ok
          else
            render json: { error: "Project not found" }, status: :not_found
          end
        end

        # PATCH/PUT /api/v1/admin/projects/:id
        # For updating status, assign to a user, set install_date, etc.
        def update
          project = Project.find_by(id: params[:id])

          unless project
            return render json: { error: "Project not found" }, status: :not_found
          end

          if project.update(project_params)
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
            :install_slot,   # 👈 important
            :description,
            :user_id
          )
        end

        def project_json(project)
          {
            id: project.id,
            name: project.name,
            status: project.status,
            location: project.location,
            install_date: project.install_date,
            install_slot: project.install_slot,  # 👈 important
            description: project.description,
            user: project.user && {
              id: project.user.id,
              name: project.user.name,
              email: project.user.email
            },
            created_at: project.created_at,
            updated_at: project.updated_at
          }
        end
      end
    end
  end
end
