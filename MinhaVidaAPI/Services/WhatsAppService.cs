using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace MinhaVidaAPI.Services
{
    public class WhatsAppService
    {
        private readonly IConfiguration _config;

        public WhatsAppService(IConfiguration config)
        {
            _config = config;
        }

        public async Task EnviarMensagemParaCasal(string mensagem)
        {
            var sid = _config["Twilio:AccountSid"];
            var token = _config["Twilio:AuthToken"];
            var from = _config["Twilio:FromPhoneNumber"];

            if (string.IsNullOrWhiteSpace(sid) || string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(from))
            {
                return;
            }

            var numeros = new[]
            {
                _config["Twilio:MeuNumero"],
                _config["Twilio:NumeroDela"],
            }
            .Where(numero => !string.IsNullOrWhiteSpace(numero))
            .Cast<string>()
            .Distinct()
            .ToList();

            if (numeros.Count == 0)
            {
                return;
            }

            TwilioClient.Init(sid, token);

            foreach (var numero in numeros)
            {
                await MessageResource.CreateAsync(
                    body: mensagem,
                    from: new PhoneNumber(from),
                    to: new PhoneNumber($"whatsapp:{numero}")
                );
            }
        }
    }
}
