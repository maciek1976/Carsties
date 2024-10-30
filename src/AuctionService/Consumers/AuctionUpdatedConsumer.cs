using AuctionService.Data;
using Contracts;
using MassTransit;

namespace AuctionService.Consumers
{
    public class AuctionUpdatedConsumer : IConsumer<AuctionUpdated>
    {
        private readonly AuctionDbContext _dbContext;

        public AuctionUpdatedConsumer(AuctionDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task Consume(ConsumeContext<AuctionUpdated> context)
        {
            Console.WriteLine("--> Consuming auction updated");

            var auction = await _dbContext.Auctions.FindAsync(context.Message.Id);
        }
    }
}
