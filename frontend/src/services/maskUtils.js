/**
 * Aplica máscara de telefone (16) 99999-9999
 */
export const maskTelefone = (value) => {
  if (!value) return "";
  let v = value.replace(/\D/g, ""); // Remove não-dígitos
  
  // Limita a 11 dígitos
  if (v.length > 11) v = v.slice(0, 11);

  if (v.length === 11) {
    return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (v.length === 10) {
    return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (v.length > 6) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else if (v.length > 2) {
    return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  } else if (v.length > 0) {
    return `(${v}`;
  }
  return v;
};

/**
 * Remove a máscara do telefone para enviar ao banco
 */
export const unmaskTelefone = (value) => {
  return value.replace(/\D/g, "");
};

/**
 * Validação de senha: Maiúscula, Minúscula e Número
 */
export const validarSenha = (senha) => {
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero    = /[0-9]/.test(senha);
  
  if (!temMaiuscula) return "A senha deve conter pelo menos uma letra maiúscula";
  if (!temMinuscula) return "A senha deve conter pelo menos uma letra minúscula";
  if (!temNumero)    return "A senha deve conter pelo menos um número";
  
  return true;
};
