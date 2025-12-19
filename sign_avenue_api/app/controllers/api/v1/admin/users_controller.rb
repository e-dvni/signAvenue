module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        # GET /api/v1/admin/users
        def index
            users = User.includes(:projects).order(:name)

            render json: users.map { |u|
                latest = u.projects.order(created_at: :desc).first

                user_json(u).merge(
                    latest_project: latest ? {
                        id: latest.id,
                        name: latest.name,
                        status: latest.status
                    } : nil
                )
            }, status: :ok
        end

        # GET /api/v1/admin/users/:id
        def show
          user = User.find_by(id: params[:id])
          return render json: { error: "User not found" }, status: :not_found unless user

          projects = user.projects.order(created_at: :desc)

          render json: {
            user: user_json(user),
            projects: projects.map { |p| project_json(p) }
          }, status: :ok
        end

        private

        def user_json(user)
          {
            id: user.id,
            name: user.name,
            first_name: (user.respond_to?(:first_name) ? user.first_name : nil),
            last_name: (user.respond_to?(:last_name) ? user.last_name : nil),
            email: user.email,
            role: user.role,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at
          }
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
            created_at: project.created_at,
            updated_at: project.updated_at
          }
        end
      end
    end
  end
end
