using Twilio;
using Twilio.Rest.Api.V2010.Account;

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

            // Pega os dois números do appsettings
            var numeros = new List<string>
            {
                _config["Twilio:MeuNumero"],
                _config["Twilio:NumeroDela"]
            };

            TwilioClient.Init(sid, token);

            foreach (var numero in numeros.Where(n => !string.IsNullOrEmpty(n)))
            {
                await MessageResource.CreateAsync(
                    body: mensagem,
                    from: new Twilio.Types.PhoneNumber(from),
                    to: new Twilio.Types.PhoneNumber($"whatsapp:{numero}")
                );
            }
        }
    }
}