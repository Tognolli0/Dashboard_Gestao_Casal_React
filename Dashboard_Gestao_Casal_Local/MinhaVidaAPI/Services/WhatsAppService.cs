using System.Text.Json;
using Twilio;
using Twilio.Exceptions;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace MinhaVidaAPI.Services
{
    public class WhatsAppService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<WhatsAppService> _logger;
        private static bool _disabledByAuthFailure;

        public WhatsAppService(IConfiguration config, ILogger<WhatsAppService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task EnviarMensagemParaCasal(string mensagem)
        {
            if (_disabledByAuthFailure)
            {
                return;
            }

            var sid = _config["Twilio:AccountSid"];
            var token = _config["Twilio:AuthToken"];
            var from = _config["Twilio:FromPhoneNumber"];
            var contentSid = _config["Twilio:ContentSid"];
            var useTemplateMessages = _config.GetValue("Twilio:UseContentTemplate", false);

            if (string.IsNullOrWhiteSpace(sid) || string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(from))
            {
                _logger.LogInformation("Twilio nao configurado. Mensagem ignorada.");
                return;
            }

            var numeros = new[]
            {
                _config["Twilio:MeuNumero"],
                _config["Twilio:NumeroDela"],
            }
            .Where(numero => !string.IsNullOrWhiteSpace(numero))
            .Select(NormalizeWhatsAppNumber)
            .Distinct()
            .ToList();

            if (numeros.Count == 0)
            {
                return;
            }

            TwilioClient.Init(sid, token);
            var fromNumber = new PhoneNumber(NormalizeWhatsAppNumber(from));

            foreach (var numero in numeros)
            {
                try
                {
                    if (useTemplateMessages && !string.IsNullOrWhiteSpace(contentSid))
                    {
                        var options = new CreateMessageOptions(new PhoneNumber(numero))
                        {
                            From = fromNumber,
                            ContentSid = contentSid,
                            ContentVariables = BuildTemplateVariables(mensagem)
                        };

                        await MessageResource.CreateAsync(options);
                    }
                    else
                    {
                        await MessageResource.CreateAsync(
                            body: mensagem,
                            from: fromNumber,
                            to: new PhoneNumber(numero)
                        );
                    }
                }
                catch (ApiException ex) when (string.Equals(ex.Message, "Authenticate", StringComparison.OrdinalIgnoreCase))
                {
                    _disabledByAuthFailure = true;
                    _logger.LogError("Twilio rejeitou autenticacao. Revise AccountSid/AuthToken e reinicie o aplicativo.");
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Falha ao enviar WhatsApp para {Numero}.", numero);
                }
            }
        }

        private static string BuildTemplateVariables(string mensagem)
        {
            var values = new Dictionary<string, string>
            {
                ["1"] = DateTime.Now.ToString("dd/MM"),
                ["2"] = TruncateSingleLine(mensagem, 40)
            };

            return JsonSerializer.Serialize(values);
        }

        private static string NormalizeWhatsAppNumber(string? numero)
        {
            if (string.IsNullOrWhiteSpace(numero))
            {
                return string.Empty;
            }

            var trimmed = numero.Trim();
            return trimmed.StartsWith("whatsapp:", StringComparison.OrdinalIgnoreCase)
                ? trimmed
                : $"whatsapp:{trimmed}";
        }

        private static string TruncateSingleLine(string? text, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "Atualizacao";
            }

            var singleLine = text
                .Replace("\r", " ")
                .Replace("\n", " ")
                .Trim();

            if (singleLine.Length <= maxLength)
            {
                return singleLine;
            }

            return singleLine[..(maxLength - 3)].TrimEnd() + "...";
        }
    }
}
