/**
 * ConfigContext — configurações da loja
 *
 * Novidades nesta versão:
 *  - reloadConfig(): força recarregamento das configurações do servidor
 *  - imageVersion: contador que incrementa sempre que uma imagem é atualizada
 *    → usado para adicionar ?v=N na URL da imagem e forçar o browser a ignorar cache
 *  - bustImageUrl(url): retorna a URL com ?v=N appendado (sem duplicar)
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ConfigContext = createContext({});

const DEFAULT_CONFIG = {
  nome_loja:     'Garagem do Frango',
  telefone:      '(16) 99999-9999',
  whatsapp:      '5516999999999',
  instagram:     'garagemdofrango',
  facebook:      'garagemdofrango',
  endereco:      'Rua das Aves, 123 - Ribeirão Preto, SP',
  horario:       'Seg-Sex: 11h às 22h | Sáb-Dom: 11h às 23h',
  taxa_entrega:  '5.00',
  hero_titulo:   'O Frango Mais Gostoso da Cidade!',
  hero_subtitulo:'Assado na hora, com muito tempero e amor. Peça agora e receba em casa!',
  rota_admin:    '/garagem-frango-a9x7-controle',
};

export function ConfigProvider({ children }) {
  const [config, setConfig]             = useState(DEFAULT_CONFIG);
  const [imageVersion, setImageVersion] = useState(0);

  // Carrega configurações do banco
  const reloadConfig = useCallback(() => {
    return api.get('/configuracoes')
      .then(({ data }) => setConfig(data))
      .catch(() => {});
  }, []);

  useEffect(() => { reloadConfig(); }, [reloadConfig]);

  /**
   * Incrementa imageVersion e recarrega config.
   * Chame isso após cada upload bem-sucedido de imagem.
   */
  const invalidateImages = useCallback(() => {
    setImageVersion(v => v + 1);
    reloadConfig();
  }, [reloadConfig]);

  /**
   * Adiciona ?v=<imageVersion> à URL para forçar o browser
   * a ignorar qualquer cache da imagem anterior.
   * URLs do Vercel Blob (https://...) já são únicas por upload,
   * mas Blob URLs salvas no banco podem ser as mesmas entre updates,
   * então adicionamos o version para garantir.
   */
  const bustImageUrl = useCallback((url) => {
    if (!url) return null;
    if (imageVersion === 0) return url;          // primeira carga: sem bust
    try {
      const u = new URL(url);
      u.searchParams.set('v', imageVersion);
      return u.toString();
    } catch {
      // URL relativa — adiciona query string manualmente
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${imageVersion}`;
    }
  }, [imageVersion]);

  return (
    <ConfigContext.Provider value={{
      config,
      setConfig,
      reloadConfig,
      invalidateImages,
      bustImageUrl,
      imageVersion,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
