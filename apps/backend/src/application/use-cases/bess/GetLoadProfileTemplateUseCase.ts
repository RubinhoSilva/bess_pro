import { Result } from '@/application/common/Result';
import { IUseCase } from '@/application/common/IUseCase';

interface GetLoadProfileTemplateRequest {
  userId: string;
  profileType?: string;
}

interface LoadProfileTemplate {
  name: string;
  description: string;
  hourly_consumption: number[];
  daily_consumption: number;
  peak_power: number;
  essential_loads: number;
  backup_duration: number;
}

interface GetLoadProfileTemplateResponse {
  templates?: LoadProfileTemplate[];
  template?: LoadProfileTemplate;
}

export class GetLoadProfileTemplateUseCase implements IUseCase<GetLoadProfileTemplateRequest, Result<GetLoadProfileTemplateResponse>> {
  async execute(request: GetLoadProfileTemplateRequest): Promise<Result<GetLoadProfileTemplateResponse>> {
    try {
      // Templates de perfil de carga
      const templates: Record<string, LoadProfileTemplate> = {
        residential: {
          name: 'Residencial Padrão',
          description: 'Perfil típico de consumo residencial',
          hourly_consumption: [
            0.5, 0.4, 0.3, 0.3, 0.4, 0.8, 1.2, 1.5, 1.8, 2.0, 2.2, 2.5,
            2.8, 2.6, 2.4, 2.8, 3.2, 3.8, 4.2, 3.8, 3.2, 2.4, 1.6, 0.8
          ],
          daily_consumption: 48.5,
          peak_power: 4.5,
          essential_loads: 2.0,
          backup_duration: 8
        },
        commercial: {
          name: 'Comercial',
          description: 'Perfil típico de estabelecimento comercial',
          hourly_consumption: [
            1.0, 0.8, 0.6, 0.5, 0.8, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0,
            15.0, 14.0, 13.0, 12.0, 11.0, 10.0, 8.0, 6.0, 4.0, 3.0, 2.0, 1.5
          ],
          daily_consumption: 156.2,
          peak_power: 16.0,
          essential_loads: 5.0,
          backup_duration: 4
        },
        industrial: {
          name: 'Industrial',
          description: 'Perfil típico de consumo industrial',
          hourly_consumption: [
            15, 12, 10, 8, 12, 25, 45, 60, 75, 85, 90, 95,
            100, 95, 90, 88, 85, 80, 70, 55, 45, 35, 25, 20
          ],
          daily_consumption: 1285,
          peak_power: 120,
          essential_loads: 30,
          backup_duration: 2
        }
      };

      let response: GetLoadProfileTemplateResponse;

      if (request.profileType && templates[request.profileType]) {
        response = {
          template: templates[request.profileType]
        };
      } else {
        response = {
          templates: Object.keys(templates).map(key => ({
            type: key,
            ...templates[key]
          }))
        };
      }

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao obter templates de perfil de carga: ${error.message}`);
    }
  }
}